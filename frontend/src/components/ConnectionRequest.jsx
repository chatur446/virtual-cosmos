import { useEffect, useState } from 'react';

/**
 * ConnectionRequest
 *
 * Handles three states:
 *  1. incomingRequest  — someone wants to connect with me (Accept / Deny)
 *  2. outgoingRequest  — I'm waiting for someone to accept my request
 *  3. denial           — my request was denied or timed out
 */
export function ConnectionRequest({
  incomingRequest,
  outgoingRequest,
  denial,
  requestTimeoutMs,
  respondToRequest,
  self,
  users,
  pos,
}) {
  const [timeLeft, setTimeLeft] = useState(null);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!incomingRequest) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(Math.ceil(requestTimeoutMs / 1000));
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingRequest, requestTimeoutMs]);

  // ── Incoming request (Accept / Deny) ────────────────────────────────────────
  if (incomingRequest) {
    const { requestId, from } = incomingRequest;
    const fromUser = users.find((u) => u.id === from.id) || from;
    const timerPct = timeLeft != null ? (timeLeft / (requestTimeoutMs / 1000)) * 100 : 100;

    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          {/* Avatar dot */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: fromUser.color || '#60a5fa',
            boxShadow: `0 0 16px ${fromUser.color || '#60a5fa'}60`,
            flexShrink: 0,
          }} />

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 13,
              color: '#e2e8f0',
              marginBottom: 4,
            }}>
              <span style={{ color: fromUser.color || '#60a5fa', fontWeight: 600 }}>
                {fromUser.name}
              </span>
              {' '}wants to connect
            </div>

            {/* Timer bar */}
            <div style={{
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.08)',
              marginBottom: 10,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${timerPct}%`,
                background: timerPct > 40 ? '#34d399' : timerPct > 15 ? '#fbbf24' : '#ef4444',
                borderRadius: 2,
                transition: 'width 1s linear, background 0.3s',
              }} />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => respondToRequest(requestId, true)}
                style={acceptBtnStyle}
              >
                Accept
              </button>
              <button
                onClick={() => respondToRequest(requestId, false)}
                style={denyBtnStyle}
              >
                Deny
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Outgoing request (waiting) ───────────────────────────────────────────────
  if (outgoingRequest) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...cardStyle, opacity: 0.85 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#fbbf24',
            boxShadow: '0 0 8px #fbbf24',
            animation: 'pulse 1.5s infinite',
            flexShrink: 0,
            marginTop: 4,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 13,
              color: '#94a3b8',
            }}>
              Waiting for{' '}
              <span style={{ color: outgoingRequest.to.color || '#fbbf24' }}>
                {outgoingRequest.to.name}
              </span>
              {' '}to respond...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Denial notification ──────────────────────────────────────────────────────
  if (denial) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...cardStyle, borderColor: 'rgba(239, 68, 68, 0.4)', animation: 'fadeInUp 0.2s ease' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 8px #ef4444',
            flexShrink: 0,
            marginTop: 4,
          }} />
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 13,
            color: '#94a3b8',
          }}>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              {denial.byName}
            </span>
            {' '}{denial.reason === 'timeout' ? 'did not respond' : 'denied your request'}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'absolute',
  bottom: 90,
  right: 16,
  zIndex: 200,
  animation: 'fadeInUp 0.25s ease',
};

const cardStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  background: 'rgba(5, 2, 20, 0.95)',
  border: '1px solid rgba(96, 165, 250, 0.3)',
  borderRadius: 12,
  padding: '12px 14px',
  width: 280,
  boxShadow: '0 0 24px rgba(96, 165, 250, 0.1)',
  backdropFilter: 'blur(12px)',
};

const acceptBtnStyle = {
  flex: 1,
  padding: '6px 0',
  borderRadius: 8,
  border: 'none',
  background: 'rgba(52, 211, 153, 0.2)',
  color: '#34d399',
  fontFamily: 'Syne, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.05em',
  border: '1px solid rgba(52, 211, 153, 0.4)',
};

const denyBtnStyle = {
  flex: 1,
  padding: '6px 0',
  borderRadius: 8,
  border: '1px solid rgba(239, 68, 68, 0.3)',
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  fontFamily: 'Syne, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.05em',
};