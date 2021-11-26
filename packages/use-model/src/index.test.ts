describe('export index', () => {
  it('should exist', async () => {
    expect(await import('./index')).toEqual({ DEMO: 'Hello, world!' });
  });
});
