import {
  Client,
  PrivateKey,
  AccountId,
  Hbar,
  TopicCreateTransaction,
} from '@hashgraph/sdk';

const operatorIdStr = process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID;
const operatorKeyStr = process.env.AGENT_PRIVATE_KEY;

if (!operatorIdStr || !operatorKeyStr) {
  throw new Error('Must set NEXT_PUBLIC_AGENT_ACCOUNT_ID, AGENT_PRIVATE_KEY');
}
const operatorId = AccountId.fromString(operatorIdStr);
const operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(100));
client.setDefaultMaxQueryPayment(new Hbar(50));

async function createTopic(
  client: Client,
  operatorKey: PrivateKey | null,
  memo: string
) {
  let topicCreateTx = new TopicCreateTransaction().setTopicMemo(memo);

  if (operatorKey) {
    topicCreateTx = topicCreateTx.setSubmitKey(operatorKey.publicKey);
  }

  topicCreateTx = topicCreateTx.freezeWith(client);

  const topicCreateTxId = topicCreateTx.transactionId;
  if (topicCreateTxId) {
    console.log('Topic create transaction ID: ', topicCreateTxId.toString());
  }

  const topicCreateTxSigned = operatorKey
    ? await topicCreateTx.sign(operatorKey)
    : topicCreateTx;
  const topicCreateTxSubmitted = await topicCreateTxSigned.execute(client);
  const topicCreateTxReceipt = await topicCreateTxSubmitted.getReceipt(client);
  const topicId = topicCreateTxReceipt.topicId;

  console.log(`Topic created with ID: ${topicId} (memo: ${memo})`);
  return topicId;
}

// Example usage:
async function main() {
  try {
    // Create multiple topics
    const privateTopicId = await createTopic(
      client,
      operatorKey,
      'chat#graph private'
    );
    const publicTopicId = await createTopic(client, null, 'chat#graph public');
    console.log('public topic id', publicTopicId);
    console.log('private topic id', privateTopicId);
  } catch (error) {
    console.error('Error creating topics:', error);
  }
}

main();
