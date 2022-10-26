import { SigningPrincipal } from '@ucanto/interface';
import { Principal } from '@ucanto/principal';
import { CAR } from '@ucanto/transport';
// @ts-expect-error
import * as Store from '@web3-storage/access/capabilities/store';
// @ts-expect-error
import * as Upload from '@web3-storage/access/capabilities/upload';
import { connection } from '@web3-storage/access/connection';
import retry, { AbortError } from 'p-retry';
import { CID } from 'multiformats/cid';
import { transform } from 'streaming-iterables';

export * from './unixfs-car';
export * from './car-chunker';

// Production
const storeApiUrl = new URL(
  //   'https://8609r1772a.execute-api.us-east-1.amazonaws.com' // PROD URL
  'https://mk00d0sf0h.execute-api.us-east-1.amazonaws.com/' //STAGING URL
);
const storeDid = Principal.parse(
  'did:key:z6MkrZ1r5XBFZjBU34qyD8fueMbMRkKw17BZaq2ivKFjnz2z'
);

const RETRIES = 3;
const CONCURRENT_UPLOADS = 3;

export interface Retryable {
  retries?: number;
}

export interface CarChunkMeta {
  /**
   * CID of the CAR file (not the data it contains).
   */
  cid: CID;
  /**
   * Size of the CAR file in bytes.
   */
  size: number;
}

export interface CarChunkUploadedEvent {
  meta: CarChunkMeta;
}

export interface UploadCarChunksOptions extends Retryable {
  onChunkUploaded?: (event: CarChunkUploadedEvent) => void;
}

export type CarData = AsyncIterable<Uint8Array>;

async function linkDataCidToCars(
  principal: SigningPrincipal,
  root: CID,
  shards: CID[],
  options: UploadCarChunksOptions = {}
) {
  const conn = connection({
    id: storeDid,
    url: storeApiUrl,
  });
  const result = await retry(
    async () => {
      const res = await Upload.add
        .invoke({
          issuer: principal,
          audience: storeDid,
          with: principal.did(),
          caveats: {
            root,
            shards,
          },
        })
        .execute(conn);
      return res;
    },
    { onFailedAttempt: console.warn, retries: options.retries ?? RETRIES }
  );

  return result;
}

/**
 * Upload multiple CAR chunks to the service, linking them together after
 * successful completion.
 */
export async function uploadCarChunks(
  principal: SigningPrincipal,
  chunks: AsyncIterable<CarData>,
  dataCID: Promise<CID>,
  options: UploadCarChunksOptions = {}
): Promise<CID[]> {
  const onChunkUploaded = options.onChunkUploaded ?? (() => {});

  const uploads = transform(
    CONCURRENT_UPLOADS,
    async (chunk) => {
      const carChunks = await collect(chunk);
      const bytes = new Uint8Array(await new Blob(carChunks).arrayBuffer());
      const cid = await uploadCarBytes(principal, bytes, options);
      onChunkUploaded({ meta: { cid, size: bytes.length } });
      return cid;
    },
    chunks
  );

  const carCids = await collect(uploads);

  const CIDs = await carCids;
  const root = await dataCID;

  const result = await linkDataCidToCars(principal, root, CIDs, options);
  console.log('result', result)
  //   if (carCids.length > 1) {
  //     // TODO: link them!
  //   }

  return carCids;
}

export async function uploadCarBytes(
  principal: SigningPrincipal,
  bytes: Uint8Array,
  options: Retryable = {}
): Promise<CID> {
  const link = await CAR.codec.link(bytes);
  const conn = connection({
    id: storeDid,
    url: storeApiUrl,
  });
  const result = await retry(
    async () => {
      const res = await Store.add
        .invoke({
          issuer: principal,
          audience: storeDid,
          with: principal.did(),
          caveats: {
            link,
            //             size: bytes.byteLength,
          },
        })
        .execute(conn);
      return res;
    },
    { onFailedAttempt: console.warn, retries: options.retries ?? RETRIES }
  );

  // Return early if it was already uploaded.
  if (result.status === 'done') {
    return link;
  }

  if (result.error != null) {
    // @ts-expect-error not cause yet
    throw new Error('failed store/add invocation', { cause: result.error });
  }

  const res = await retry(
    async () => {
      const res = await fetch(result.url, {
        method: 'PUT',
        mode: 'cors',
        body: bytes,
        headers: result.headers,
      });
      if (res.status >= 400 && res.status < 500) {
        throw new AbortError(`upload failed: ${res.status}`);
      }
      return res;
    },
    { onFailedAttempt: console.warn, retries: options.retries ?? RETRIES }
  );

  if (!res.ok) {
    throw new Error('upload failed');
  }

  return link;
}

async function collect<T>(
  collectable: AsyncIterable<T> | Iterable<T>
): Promise<T[]> {
  const chunks: T[] = [];
  for await (const chunk of collectable) chunks.push(chunk);
  return chunks;
}
