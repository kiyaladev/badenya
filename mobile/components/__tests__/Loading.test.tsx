import React from 'react';
import { render } from '@testing-library/react-native';
import { Loading } from '../ui/Loading';

describe('Loading Components', () => {
  describe('Loading', () => {
    it('should render activity indicator', () => {
      const { getByTestId } = render(<Loading />);
      // ActivityIndicator is rendered
      expect(getByTestId).toBeDefined();
    });

    it('should render with text', () => {
      const { getByText } = render(<Loading text="Loading data..." />);
      expect(getByText('Loading data...')).toBeTruthy();
    });

    it('should render with small size', () => {
      const { getByTestId } = render(<Loading size="small" />);
      expect(getByTestId).toBeDefined();
    });

    it('should render with large size', () => {
      const { getByTestId } = render(<Loading size="large" />);
      expect(getByTestId).toBeDefined();
    });

    it('should render fullScreen variant', () => {
      const { getByTestId } = render(<Loading fullScreen={true} testID="loading" />);
      expect(getByTestId('loading')).toBeTruthy();
    });

    it('should not render text by default', () => {
      const { queryByText } = render(<Loading />);
      // There should be no text if not provided
      expect(queryByText('Loading')).toBeNull();
    });
  });
});
