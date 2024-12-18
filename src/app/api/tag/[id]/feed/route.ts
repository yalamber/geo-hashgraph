import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import axios from 'axios';
import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';

const MIRROR_NODE_URL =
  process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? 'https://mainnet-public.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';

const client = Client.forTestnet();

interface MirrorNodeMessage {
  sequence_number: string;
  consensus_timestamp: string;
  message: string;
  topic_id: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const privateKeyString = authHeader.split(' ')[1];
    const topicId = params.id;

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
    const privateKey = PrivateKey.fromStringECDSA(privateKeyString);
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);

    const frozenTx = transaction.freezeWith(client);
    const signedTx = await frozenTx.sign(privateKey);
    const response = await signedTx.execute(client);

    const receipt = await response.getReceipt(client);

    if (receipt.status.toString() !== 'SUCCESS') {
      throw new Error('Failed to submit message to topic');
    }

    return NextResponse.json({
      status: 'success',
      transactionId: response.transactionId.toString(),
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
  { params }: { params: { id: string } }
) {
  try {
    const topicId = params.id;
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
