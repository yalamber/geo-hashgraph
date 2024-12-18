import { NextResponse } from 'next/server';
import {
  PrivateKey,
  TopicCreateTransaction,
  TransactionRecordQuery,
  Client,
  Hbar,
  HbarUnit,
} from '@hashgraph/sdk';
import redis from '@/lib/redis';
import { verifyAuth } from '@/lib/auth';

const client = Client.forTestnet();
client.setOperator(
  process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
  process.env.HEDERA_PRIVATE_KEY!
);

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const authIssuer = searchParams.get('issuer');

    // Verify the requester is accessing their own data
    if (authIssuer !== auth.issuer) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Get tag IDs for specific account using issuer
    const tagIds = await redis.smembers(`account:${authIssuer}:tags`);

    // Fetch full tag details for each ID
    const tags = await Promise.all(
      tagIds.map(async (id) => {
        const tag = await redis.hgetall(`tag:${id}`);
        // Don't send keys to client
        delete tag.privateKey;
        delete tag.publicKey;
        return tag;
      })
    );

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { title, description, transactionId } = await request.json();

    // Get transaction details
    const transactionRecord = await new TransactionRecordQuery()
      .setTransactionId(transactionId)
      .execute(client);
    // Check if transaction was successful
    if (transactionRecord.receipt.status.toString() !== 'SUCCESS') return;
    // Find transfer to agent account
    const operatorTransfer = transactionRecord.transfers.find(
      (transfer) =>
        transfer.accountId.toString() ===
        process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID
    );
    // Verify agent received 10 HBAR
    if (
      !operatorTransfer ||
      operatorTransfer.amount.toString() !==
        new Hbar(10, HbarUnit.Hbar).toString()
    ) {
      console.log('Payment verification failed: Incorrect amount received');
      throw new Error('Payment verification failed: Incorrect amount received');
    }
    // Generate a new private key for the topic
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;

    // Create a new private topic
    const topicCreateTx = new TopicCreateTransaction()
      .setTopicMemo(`geo-tag-${title}`)
      .setSubmitKey(publicKey)
      .freezeWith(client);
    const topicCreateTxSigned = await topicCreateTx.sign(
      PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
    );
    const txResponse = await topicCreateTxSigned.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId?.toString();

    if (!topicId) {
      throw new Error('Failed to create Hedera topic');
    }

    // Create tag object
    const responseTag = {
      id: topicId, // Using Hedera topic ID as tag ID
      name: title,
      description,
      createdAt: new Date().toISOString(),
    };

    // Store tag data in Redis
    await redis.hset(`tag:${topicId}`, {
      ...responseTag,
      // Don't send private key in response
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
    });
    // Add tag to account's set of tags
    await redis.sadd(`account:${auth.issuer}:tags`, topicId);

    return NextResponse.json(responseTag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
