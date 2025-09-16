import React from 'react';

const TestMinimal = () => {
  console.log('TestMinimal component rendering...');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
      <h1>MINIMAL TEST COMPONENT</h1>
      <p>If you can see this, React is working!</p>
    </div>
  );
};

export default TestMinimal;