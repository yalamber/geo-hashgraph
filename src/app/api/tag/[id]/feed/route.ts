import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import axios from 'axios';
import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';
import { verifyAuth } from '@/lib/auth';

const MIRROR_NODE_URL =
  process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? 'https://mainnet-public.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';

const client = Client.forTestnet();
client.setOperator(
  process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
  process.env.HEDERA_PRIVATE_KEY!
);

interface MirrorNodeMessage {
  sequence_number: string;
  consensus_timestamp: string;
  message: string;
  topic_id: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params;
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const privateKeyString = authHeader.split(' ')[1];

    // Verify tag exists and get its details
    const tag = await redis.hgetall(`tag:${topicId}`);
    if (!tag || Object.keys(tag).length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Verify private key matches the tag
    if (tag.privateKey !== privateKeyString) {
      return NextResponse.json(
        { error: 'Invalid private key' },
        { status: 401 }
      );
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Submit message to topic
    const privateKey = PrivateKey.fromStringED25519(privateKeyString);
    const submitMsgTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .freezeWith(client)
      .sign(privateKey);

    const submitMsgTxSubmit = await submitMsgTx.execute(client);
    const receipt = await submitMsgTxSubmit.getReceipt(client);

    if (receipt.status.toString() !== 'SUCCESS') {
      throw new Error('Failed to submit message to topic');
    }
    return NextResponse.json({
      status: 'success',
      transactionId: submitMsgTxSubmit.transactionId.toString(),
    });
  } catch (error) {
    console.error('Error submitting message:', error);
    return NextResponse.json(
      { error: 'Failed to submit message' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params;

    const auth = await verifyAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '25';
    const timestamp = searchParams.get('timestamp') || '';

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Get tag details to verify it exists
    const tag = await redis.hgetall(`tag:${topicId}`);
    if (!tag || Object.keys(tag).length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Construct mirror node query
    let url = `${MIRROR_NODE_URL}/api/v1/topics/${topicId}/messages`;
    const queryParams = new URLSearchParams({
      limit,
      order: 'desc',
    });

    if (timestamp) {
      queryParams.append('timestamp', timestamp);
    }

    url += `?${queryParams.toString()}`;

    // Fetch messages from mirror node
    const response = await axios.get(url);
    const messages = response.data.messages.map((msg: MirrorNodeMessage) => ({
      sequenceNumber: msg.sequence_number,
      consensusTimestamp: msg.consensus_timestamp,
      message: Buffer.from(msg.message, 'base64').toString(),
      topicId: msg.topic_id,
    }));

    return NextResponse.json({
      messages,
      links: response.data.links,
    });
  } catch (error) {
    console.error('Error fetching topic messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
