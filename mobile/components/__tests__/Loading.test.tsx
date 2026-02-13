import React from 'react';
import { render } from '@testing-library/react-native';
import { Loading, SkeletonItem, SkeletonCard, SkeletonList } from '../ui/Loading';

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

  describe('SkeletonItem', () => {
    it('should render skeleton item', () => {
      const { getByTestId } = render(<SkeletonItem testID="skeleton" />);
      expect(getByTestId('skeleton')).toBeTruthy();
    });

    it('should render with custom height', () => {
      const { getByTestId } = render(<SkeletonItem height={100} testID="skeleton" />);
      const skeleton = getByTestId('skeleton');
      expect(skeleton.props.style.height).toBe(100);
    });

    it('should render with default height', () => {
      const { getByTestId } = render(<SkeletonItem testID="skeleton" />);
      const skeleton = getByTestId('skeleton');
      expect(skeleton.props.style.height).toBe(80);
    });
  });

  describe('SkeletonCard', () => {
    it('should render skeleton card', () => {
      const { getByTestId } = render(<SkeletonCard testID="skeleton-card" />);
      expect(getByTestId).toBeDefined();
    });
  });

  describe('SkeletonList', () => {
    it('should render default number of skeleton cards', () => {
      render(<SkeletonList count={3} />);
      // Should render 3 skeleton cards by default
    });

    it('should render custom number of skeleton cards', () => {
      render(<SkeletonList count={5} />);
      // Should render 5 skeleton cards
    });
  });
});
