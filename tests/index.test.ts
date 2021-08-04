const sum = (a: number, b: number) => a + b;

describe("sum", () => {
  test("basic", () => {
    expect(sum(1, 2)).toBe(3);
  });
});
