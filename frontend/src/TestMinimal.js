import React from 'react';

function TestMinimal() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Trade AI Test</h1>
      <p>If you can see this, React is working!</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
}

export default TestMinimal;
