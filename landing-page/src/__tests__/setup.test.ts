describe('Landing Page Setup', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should be able to do basic assertions', () => {
    const value = 'Badenya';
    expect(value).toBe('Badenya');
    expect(value).toContain('Bad');
  });

  it('should handle numbers', () => {
    const sum = 1 + 2;
    expect(sum).toBe(3);
    expect(sum).toBeGreaterThan(2);
  });

  it('should handle arrays', () => {
    const features = ['savings', 'tontine', 'loans'];
    expect(features).toHaveLength(3);
    expect(features).toContain('tontine');
  });
});
