module.exports = {
  extends: ['./.eslintrc.js'],
  rules: {
    'no-unused-vars': 'error',
    'react-hooks/exhaustive-deps': 'off', // We'll fix these manually with useCallback
    'import/no-anonymous-default-export': 'off' // We'll fix these manually
  }
};
