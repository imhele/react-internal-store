describe('export index', () => {
  it('should exist', async () => {
    expect(await import('./index')).toEqual({
      createStore: expect.any(Function),
      defineModel: expect.any(Function),
    });
  });
});
