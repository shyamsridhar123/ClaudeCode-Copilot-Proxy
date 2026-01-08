// Mock implementation of node-fetch for Jest tests
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn(() => Promise.resolve({})),
    text: jest.fn(() => Promise.resolve('')),
    headers: new Map(),
  })
);

export default mockFetch as unknown as typeof fetch;
