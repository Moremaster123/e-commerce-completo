import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

import { resetApiMock } from '../api/__mocks__/client';

vi.mock('../api/client');

beforeEach(() => {
    resetApiMock();
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});
