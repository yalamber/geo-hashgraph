import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function UInt8ToString(array: Uint8Array): string {
  return Buffer.from(array).toString('hex');
}

export function secondsToDate(time: { seconds: { toNumber(): number } }) {
  const date = new Date(1970, 0, 1);
  date.setSeconds(time.seconds.toNumber());
  return date;
}

export function convertTransactionIdForMirrorNodeApi(txId: string) {
  // The transaction ID has to be converted to the correct format to pass in the mirror node query (0.0.x@x.x to 0.0.x-x-x)
  const [txIdA, initialTxIdB] = txId.toString().split('@');
  const txIdB = initialTxIdB.replace('.', '-');
  const txIdMirrorNodeFormat = `${txIdA}-${txIdB}`;
  return txIdMirrorNodeFormat;
}

export function getAccountIdfromTxId(txId: string) {
  const [txIdA] = txId.toString().split('@');
  return txIdA;
}
