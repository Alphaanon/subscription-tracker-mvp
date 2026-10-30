'use client';

import { useEffect, useState } from 'react';

export default function PaymentPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Payment addresses - deployed and verified
  const bitcoinAddress = '1BbbUca2EKsNZ3hgRnVJJcKw4DHsVoZP6P';
  const ethereumAddress = '0x4eA78ffA7Be9299d61DF1185684a4b63Bf8fB46e';
  const usdcAddress = '0x40D9e5Cf9af074ADa6A0290f5B353cdB36f5b86C';

  const copyAddress = async (address: string, label: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(label);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ color: '#333', marginBottom: '10px', textAlign: 'center' }}>
          🎉 Support Subscription Tracker
        </h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: '30px' }}>
          Help keep this tool free and ad-free! Choose your preferred payment method.
        </p>

        <p style={{ color: '#555', lineHeight: 1.6, marginBottom: '20px' }}>
          Love Subscription Tracker? Show your appreciation with a donation. 
          Your support helps maintain the service and add new features.
        </p>

        {/* Bitcoin */}
        <div style={{
          background: '#fff9e6',
          border: '2px solid #f7931a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '32px', marginRight: '10px' }}>₿</span>
            <h3 style={{ margin: 0, color: '#333' }}>Bitcoin</h3>
          </div>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            Send Bitcoin to this address:
          </p>
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            wordBreak: 'break-all',
            margin: '10px 0',
            border: '1px solid #ddd',
          }}>
            {bitcoinAddress}
          </div>
          <button
            onClick={() => copyAddress(bitcoinAddress, 'BTC')}
            style={{
              background: '#f7931a',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '5px',
            }}
          >
            {copiedAddress === 'BTC' ? '✓ Copied!' : '📋 Copy Address'}
          </button>
        </div>

        {/* Ethereum */}
        <div style={{
          background: '#f0f4ff',
          border: '2px solid #627eea',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '32px', marginRight: '10px' }}>◎</span>
            <h3 style={{ margin: 0, color: '#333' }}>Ethereum</h3>
          </div>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            Send ETH or any ERC-20 tokens to this address:
          </p>
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            wordBreak: 'break-all',
            margin: '10px 0',
            border: '1px solid #ddd',
          }}>
            {ethereumAddress}
          </div>
          <button
            onClick={() => copyAddress(ethereumAddress, 'ETH')}
            style={{
              background: '#627eea',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '5px',
            }}
          >
            {copiedAddress === 'ETH' ? '✓ Copied!' : '📋 Copy Address'}
          </button>
        </div>

        {/* USDC */}
        <div style={{
          background: '#f0fff4',
          border: '2px solid #48bb78',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '32px', marginRight: '10px' }}>💵</span>
            <h3 style={{ margin: 0, color: '#333' }}>USDC Stablecoin</h3>
          </div>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            Send USDC (ERC-20) to this address:
          </p>
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            wordBreak: 'break-all',
            margin: '10px 0',
            border: '1px solid #ddd',
          }}>
            {usdcAddress}
          </div>
          <button
            onClick={() => copyAddress(usdcAddress, 'USDC')}
            style={{
              background: '#48bb78',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '5px',
            }}
          >
            {copiedAddress === 'USDC' ? '✓ Copied!' : '📋 Copy Address'}
          </button>
        </div>

        <p><strong>Suggested Donation Amounts:</strong></p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '20px',
        }}>
          <button style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}>☕ $50</button>
          <button style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}>🎉 $250</button>
          <button style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}>🚀 $500</button>
        </div>

        <p style={{ color: '#555', lineHeight: 1.6 }}>
          Every contribution, no matter the size, is appreciated! <br />
          Thank you for supporting open-source tools.
        </p>

        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '20px',
            color: '#667eea',
            textDecoration: 'none',
          }}
        >
          ← Back to Subscription Tracker
        </a>
      </div>
    </div>
  );
}
