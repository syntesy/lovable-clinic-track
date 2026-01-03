import { getPasswordStrength } from '@/lib/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
}

export function PasswordStrengthIndicator({ password, showFeedback = true }: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Barra de força */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: index < strength.score ? strength.color : '#253441',
              transition: 'background-color 0.2s ease'
            }}
          />
        ))}
      </div>

      {/* Label de força */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: showFeedback && strength.feedback.length > 0 ? '8px' : '0'
      }}>
        <span style={{ 
          fontSize: '11px', 
          color: strength.color,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500
        }}>
          {strength.label}
        </span>
        <span style={{ 
          fontSize: '11px', 
          color: '#B7BBC0',
          fontFamily: 'Inter, sans-serif'
        }}>
          {strength.score}/4
        </span>
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <ul style={{ 
          margin: 0, 
          padding: 0, 
          listStyle: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          {strength.feedback.map((item, index) => (
            <li 
              key={index} 
              style={{ 
                fontSize: '10px',
                color: '#B7BBC0',
                backgroundColor: '#253441',
                padding: '3px 8px',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
