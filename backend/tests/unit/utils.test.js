describe('Basic Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have test utilities available', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.createObjectId).toBeDefined();
    expect(global.testUtils.generateRandomString).toBeDefined();
  });

  it('should create test ObjectId', () => {
    const id = global.testUtils.createObjectId();
    expect(id).toBeDefined();
    expect(id.toString()).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('should generate random string', () => {
    const str = global.testUtils.generateRandomString(10);
    expect(str).toBeDefined();
    expect(str.length).toBe(10);
  });

  it('should create mock request and response', () => {
    const req = global.testUtils.createMockReq();
    const res = global.testUtils.createMockRes();
    const next = global.testUtils.createMockNext();

    expect(req).toBeDefined();
    expect(res).toBeDefined();
    expect(next).toBeDefined();
    expect(typeof next).toBe('function');
  });
});