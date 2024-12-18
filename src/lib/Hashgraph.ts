import {
  Client,
  AccountBalanceQuery,
  AccountInfoQuery,
  AccountRecordsQuery,
  TransactionReceiptQuery,
  AccountId,
  AccountBalance,
  AccountInfo,
  TransactionRecord,
  TransactionReceipt,
  TransactionId,
  TransactionResponse,
  LedgerId,
  Executable,
} from '@hashgraph/sdk';

export class Hashgraph {
  private _client: Client;

  constructor(hedera_network: string) {
    if (!hedera_network) {
      throw new Error(
        'LocalProvider requires the `HEDERA_NETWORK` environment variable to be set'
      );
    }

    this._client = Client.forName(hedera_network);
  }

  getLedgerId(): LedgerId | null {
    return this._client.ledgerId;
  }

  getNetwork(): { [key: string]: string | AccountId } {
    return this._client.network;
  }

  getMirrorNetwork(): string[] {
    return this._client.mirrorNetwork;
  }

  getAccountBalance(accountId: AccountId | string): Promise<AccountBalance> {
    return new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(this._client);
  }

  getAccountInfo(accountId: AccountId | string): Promise<AccountInfo> {
    return new AccountInfoQuery().setAccountId(accountId).execute(this._client);
  }

  getAccountRecords(
    accountId: AccountId | string
  ): Promise<TransactionRecord[]> {
    return new AccountRecordsQuery()
      .setAccountId(accountId)
      .execute(this._client);
  }

  getTransactionReceipt(
    transactionId: TransactionId | string
  ): Promise<TransactionReceipt> {
    return new TransactionReceiptQuery()
      .setTransactionId(transactionId)
      .execute(this._client);
  }

  waitForReceipt(response: TransactionResponse): Promise<TransactionReceipt> {
    return new TransactionReceiptQuery()
      .setNodeAccountIds([response.nodeId])
      .setTransactionId(response.transactionId)
      .execute(this._client);
  }

  call<RequestT, ResponseT, OutputT>(
    request: Executable<RequestT, ResponseT, OutputT>
  ): Promise<OutputT> {
    return request.execute(this._client);
  }
}
