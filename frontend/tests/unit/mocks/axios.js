export default function axiosMock() {
  jest.mock("axios", () => ({
    create: jest.fn(),
  }));
}
