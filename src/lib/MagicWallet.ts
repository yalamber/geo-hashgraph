import {
  PrivateKey,
  AccountId,
  SignerSignature,
  AccountBalanceQuery,
  AccountInfoQuery,
  AccountRecordsQuery,
  TransactionId,
  PublicKey,
  Provider,
  Transaction,
  Wallet,
  Executable,
} from '@hashgraph/sdk';
import { shuffle } from '@magic-ext/hedera';

type SignerFunction = (message: Uint8Array) => Promise<Uint8Array>;

export class MagicWallet {
  private publicKey: PublicKey;
  private signer: SignerFunction;
  private provider: Provider | undefined;
  private accountId: AccountId;

  constructor(
    accountId: AccountId | string,
    provider: Provider | undefined,
    publicKey: string,
    magicSign: SignerFunction
  ) {
    this.publicKey = PublicKey.fromString(publicKey);
    this.signer = magicSign;
    this.provider = provider;
    this.accountId =
      typeof accountId === 'string'
        ? AccountId.fromString(accountId)
        : accountId;
  }

  static createRandomED25519(): Promise<Wallet> {
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;
    const accountId = publicKey.toAccountId(0, 0);
    return Promise.resolve(new Wallet(accountId, privateKey));
  }

  static createRandomECDSA(): Promise<Wallet> {
    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey;
    const accountId = publicKey.toAccountId(0, 0);
    return Promise.resolve(new Wallet(accountId, privateKey));
  }

  getProvider(): Provider | undefined {
    return this.provider;
  }

  getAccountId(): AccountId {
    return this.accountId;
  }

  getAccountKey(): PublicKey {
    return this.publicKey;
  }

  getLedgerId() {
    return this.provider == null ? null : this.provider.getLedgerId();
  }

  getNetwork(): { [key: string]: (string | AccountId) } {
    return this.provider == null ? {} : this.provider.getNetwork();
  }

  getMirrorNetwork(): string[] {
    return this.provider == null ? [] : this.provider.getMirrorNetwork();
  }

  async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
    const signatures: SignerSignature[] = [];

    for (const message of messages) {
      signatures.push(
        new SignerSignature({
          publicKey: this.publicKey,
          signature: await this.signer(message),
          accountId: this.accountId,
        })
      );
    }

    return signatures;
  }

  getAccountBalance() {
    return this.call(new AccountBalanceQuery().setAccountId(this.accountId));
  }

  getAccountInfo() {
    return this.call(new AccountInfoQuery().setAccountId(this.accountId));
  }

  getAccountRecords() {
    return this.call(new AccountRecordsQuery().setAccountId(this.accountId));
  }

  signTransaction<T extends Transaction>(transaction: T): Promise<T> {
    return transaction.signWith(this.publicKey, this.signer);
  }

  checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
    const transactionId = transaction.transactionId;
    if (
      transactionId != null &&
      transactionId.accountId != null &&
      transactionId.accountId.compare(this.accountId) != 0
    ) {
      throw new Error(
        "transaction's ID constructed with a different account ID"
      );
    }

    if (this.provider == null) {
      return Promise.resolve(transaction);
    }

    const nodeAccountIds = (
      transaction.nodeAccountIds != null ? transaction.nodeAccountIds : []
    ).map((nodeAccountId) => nodeAccountId.toString());
    const network = Object.values(this.provider.getNetwork()).map(
      (nodeAccountId) => nodeAccountId.toString()
    );

    if (
      !nodeAccountIds.reduce(
        (previous, current) => previous && network.includes(current),
        true
      )
    ) {
      throw new Error(
        'Transaction already set node account IDs to values not within the current network'
      );
    }

    return Promise.resolve(transaction);
  }

  populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
    transaction._freezeWithAccountId(this.accountId);

    if (transaction.transactionId == null) {
      transaction.setTransactionId(TransactionId.generate(this.accountId));
    }

    if (
      transaction.nodeAccountIds != null &&
      transaction.nodeAccountIds.length != 0
    ) {
      return Promise.resolve(transaction.freeze());
    }

    if (this.provider == null) {
      return Promise.resolve(transaction);
    }

    const nodeAccountIds = Object.values(this.provider.getNetwork()).map((id) =>
      typeof id === 'string' ? AccountId.fromString(id) : id
    );
    shuffle(nodeAccountIds);
    transaction.setNodeAccountIds(
      nodeAccountIds.slice(0, (nodeAccountIds.length + 3 - 1) / 3)
    );

    return Promise.resolve(transaction.freeze());
  }

  call<RequestT, ResponseT, OutputT>(
    request: Executable<RequestT, ResponseT, OutputT>
  ): Promise<OutputT> {
    if (this.provider == null) {
      throw new Error(
        "cannot send request with an wallet that doesn't contain a provider"
      );
    }

    return this.provider.call(
      request._setOperatorWith(this.accountId, this.publicKey, this.signer)
    );
  }
}
