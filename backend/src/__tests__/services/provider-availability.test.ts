const mockModel = {};
const mockGetModel = jest.fn(() => mockModel);
const mockGoogle = jest.fn(() => ({ getGenerativeModel: mockGetModel }));
jest.mock('@google/generative-ai', () => ({ GoogleGenerativeAI: mockGoogle }));
jest.mock('../../utils/logger', () => ({ __esModule: true, default: { warn: jest.fn() } }));
jest.mock('../../config/firebase', () => ({ isFirebaseReady: () => false }));
import aiService, { AIService } from '../../services/ai.service';
import { capabilities } from '../../services/capabilities.service';

const originalEnv = { ...process.env };
beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  jest.clearAllMocks();
});
afterEach(() => { process.env = originalEnv; jest.restoreAllMocks(); });

it('keeps Gemini unavailable for placeholder keys or an absent model', () => {
  process.env.GEMINI_MODEL = 'configured-test-model';
  for (const key of ['your-gemini-api-key', 'YOUR_API_KEY', ' ', '<api-key>']) {
    process.env.GEMINI_API_KEY = key;
    expect(new AIService().isAvailable()).toBe(false);
  }
  process.env.GEMINI_API_KEY = 'configured-test-key';
  delete process.env.GEMINI_MODEL;
  expect(new AIService().isAvailable()).toBe(false);
  expect(mockGoogle).not.toHaveBeenCalled();
});
it('does not initialize Gemini with a placeholder model', () => {
  process.env.GEMINI_API_KEY = 'configured-test-key';
  process.env.GEMINI_MODEL = 'your-gemini-model';
  expect(new AIService().isAvailable()).toBe(false);
  expect(mockGoogle).not.toHaveBeenCalled();
});
it('uses the explicitly configured model instead of a hardcoded legacy model', () => {
  process.env.GEMINI_API_KEY = 'configured-test-key';
  process.env.GEMINI_MODEL = ' configured-test-model ';
  expect(new AIService().isAvailable()).toBe(true);
  expect(mockGetModel).toHaveBeenCalledWith({ model: 'configured-test-model' });
});
it('reports the same Gemini availability as the service used by AI routes', () => {
  const available = jest.spyOn(aiService, 'isAvailable');
  available.mockReturnValue(false);
  expect(capabilities().ai).toBe(false);
  available.mockReturnValue(true);
  expect(capabilities().ai).toBe(true);
});
