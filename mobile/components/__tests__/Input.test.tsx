import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../ui/Input';

describe('Input Component', () => {
  it('should render with placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should render with label', () => {
    const { getByText } = render(<Input label="Username" placeholder="Enter username" />);
    expect(getByText('Username')).toBeTruthy();
  });

  it('should render error message', () => {
    const { getByText } = render(<Input error="This field is required" />);
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('should render helper text', () => {
    const { getByText } = render(<Input helperText="Enter at least 8 characters" />);
    expect(getByText('Enter at least 8 characters')).toBeTruthy();
  });

  it('should not show helper text when error is present', () => {
    const { getByText, queryByText } = render(
      <Input error="This field is required" helperText="Enter at least 8 characters" />
    );
    expect(getByText('This field is required')).toBeTruthy();
    expect(queryByText('Enter at least 8 characters')).toBeNull();
  });

  it('should handle onChangeText event', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onChangeText={onChangeTextMock} />
    );

    const input = getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'test value');

    expect(onChangeTextMock).toHaveBeenCalledWith('test value');
  });

  it('should handle focus and blur events', () => {
    const onFocusMock = jest.fn();
    const onBlurMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onFocus={onFocusMock} onBlur={onBlurMock} />
    );

    const input = getByPlaceholderText('Enter text');
    fireEvent(input, 'focus');
    expect(onFocusMock).toHaveBeenCalled();

    fireEvent(input, 'blur');
    expect(onBlurMock).toHaveBeenCalled();
  });

  it('should support secure text entry', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Password" secureTextEntry={true} />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('should be editable by default', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
    const input = getByPlaceholderText('Enter text');
    expect(input.props.editable).not.toBe(false);
  });

  it('should support editable prop', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" editable={false} />);
    const input = getByPlaceholderText('Enter text');
    expect(input.props.editable).toBe(false);
  });
});
