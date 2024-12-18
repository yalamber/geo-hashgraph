import {
  Client,
  PrivateKey,
  AccountId,
  Hbar,
  HbarUnit,
  TransferTransaction,
} from '@hashgraph/sdk';

const operatorIdStr = process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID;
const operatorKeyStr = process.env.AGENT_PRIVATE_KEY;

if (!operatorIdStr || !operatorKeyStr) {
  throw new Error('Must set AGENT_ACCOUNT_ID, AGENT_PRIVATE_KEY');
}
const operatorId = AccountId.fromString(operatorIdStr);
const operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(100));
client.setDefaultMaxQueryPayment(new Hbar(50));
const sendAmount = 100;

const transferTx = new TransferTransaction()
  .setTransactionMemo(`Hello Future World transfer`)
  .addHbarTransfer(
    process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID!,
    new Hbar(-sendAmount, HbarUnit.Hbar)
  )
  .addHbarTransfer('0.0.5275837', new Hbar(sendAmount, HbarUnit.Hbar))
  // Freeze the transaction to prepare for signing
  .freezeWith(client);

const transferTxSigned = await transferTx.sign(operatorKey);

// Submit the transfer transaction to the Hedera network
const transferTxSubmitted = await transferTxSigned.execute(client);

// Get the transfer transaction receipt
const transferTxReceipt = await transferTxSubmitted.getReceipt(client);

// Get the transaction consensus status
const transactionStatus = transferTxReceipt.status;

// Log the transaction status
console.log(
  'The transfer transaction status is:',
  transactionStatus.toString()
);
