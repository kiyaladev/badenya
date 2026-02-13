# 🎨 Badenya Design System

**Version:** 1.0  
**Last Updated:** 2025-10-10  
**Status:** Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Components](#components)
5. [Layout System](#layout-system)
6. [Spacing](#spacing)
7. [Usage Guidelines](#usage-guidelines)

---

## Overview

The Badenya design system provides a comprehensive set of reusable components, styles, and patterns that ensure consistency across the mobile application. Built with React Native, NativeWind (Tailwind CSS), and TypeScript.

### Key Principles

- **Consistency:** Unified visual language across all screens
- **Accessibility:** Components designed for all users
- **Scalability:** Easy to extend and maintain
- **Performance:** Optimized for mobile devices

---

## Color Palette

### Light Mode

#### Primary Colors
```typescript
primary:      '#0284c7'  // Main brand color
primaryDark:  '#0369a1'  // Hover/active states
primaryLight: '#38bdf8'  // Backgrounds/accents
```

#### Secondary Colors
```typescript
secondary:      '#c026d3'  // Accent color
secondaryDark:  '#a21caf'
secondaryLight: '#e879f9'
```

#### Neutral Colors
```typescript
background:  '#ffffff'  // Main background
surface:     '#f9fafb'  // Cards, elevated surfaces
card:        '#ffffff'  // Card backgrounds
```

#### Text Colors
```typescript
text:          '#111827'  // Primary text
textSecondary: '#6b7280'  // Secondary text
textTertiary:  '#9ca3af'  // Disabled/placeholder
```

#### Status Colors
```typescript
success: '#10b981'  // Success states
warning: '#f59e0b'  // Warning states
error:   '#ef4444'  // Error states
info:    '#3b82f6'  // Info states
```

### Dark Mode

All colors are automatically adjusted for dark mode with higher contrast and darker backgrounds.

```typescript
background: '#111827'
surface:    '#1f2937'
text:       '#f9fafb'
```

---

## Typography

### Font Sizes

```typescript
xs:   12px  // Small labels
sm:   14px  // Body small, captions
base: 16px  // Default body text
lg:   18px  // Body large
xl:   20px  // H4
2xl:  24px  // H3
3xl:  30px  // H2
4xl:  36px  // H1
```

### Components

#### DisplayText
Large, bold text for hero sections.
```tsx
<DisplayText>Welcome to Badenya</DisplayText>
```

#### Headings (H1-H4)
```tsx
<H1>Page Title</H1>
<H2>Section Title</H2>
<H3>Subsection</H3>
<H4>Minor Heading</H4>
```

#### Body Text
```tsx
<BodyLarge>Important paragraph</BodyLarge>
<Body>Regular text</Body>
<BodySmall>Fine print</BodySmall>
```

#### Special Text
```tsx
<Caption>12:30 PM</Caption>
<Label>Field Label</Label>
<Overline>CATEGORY</Overline>
```

---

## Components

### Base Components

Located in `mobile/components/ui/`

#### Button
Primary action button with loading state.

```tsx
import { Button } from '@/components/ui';

<Button onPress={handleSubmit} disabled={loading}>
  Submit
</Button>
```

**Props:**
- `onPress`: Function - Click handler
- `disabled`: Boolean - Disable state
- `variant?`: 'primary' | 'secondary' | 'outline'
- `size?`: 'sm' | 'md' | 'lg'

#### Input
Text input with label, error state, and icons.

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  error={errors.email}
  keyboardType="email-address"
/>
```

**Props:**
- `label`: String - Field label
- `value`: String - Input value
- `onChangeText`: Function - Change handler
- `placeholder?`: String
- `error?`: String - Error message
- `multiline?`: Boolean
- `keyboardType?`: KeyboardType
- `leftIcon?`: ReactNode
- `rightIcon?`: ReactNode

#### Card
Container for grouped content.

```tsx
import { Card } from '@/components/ui';

<Card>
  <Text>Card content</Text>
</Card>
```

**Props:**
- `children`: ReactNode
- `className?`: String - Additional styles

#### Loading
Loading spinner for async operations.

```tsx
import { Loading } from '@/components/ui';

{isLoading && <Loading />}
```

---

## Layout System

### Layout Components

Located in `mobile/components/ui/Layout.tsx`

#### Container
Basic padding wrapper.

```tsx
<Container>
  <Text>Content with padding</Text>
</Container>
```

#### Screen
Safe area wrapper for full screens.

```tsx
<Screen>
  <Text>Screen content</Text>
</Screen>
```

#### ScrollableScreen
Scrollable safe area wrapper.

```tsx
<ScrollableScreen>
  <Text>Long content...</Text>
</ScrollableScreen>
```

#### Row
Horizontal layout with flexbox.

```tsx
<Row justify="between" align="center">
  <Text>Left</Text>
  <Text>Right</Text>
</Row>
```

#### Column
Vertical layout with flexbox.

```tsx
<Column align="center">
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</Column>
```

#### Stack
Spaced vertical layout.

```tsx
<Stack spacing="md">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</Stack>
```

#### Center
Centers content both horizontally and vertically.

```tsx
<Center>
  <Loading />
</Center>
```

#### Divider
Horizontal separator.

```tsx
<Divider />
```

#### Spacer
Flexible spacing element.

```tsx
<Row>
  <Text>Left</Text>
  <Spacer />
  <Text>Right</Text>
</Row>
```

---

## Spacing

Consistent spacing scale using Tailwind-inspired values:

```typescript
xs:  4px   // Minimal spacing
sm:  8px   // Small gaps
md:  16px  // Default spacing
lg:  24px  // Section spacing
xl:  32px  // Large sections
2xl: 48px  // Hero spacing
3xl: 64px  // Maximum spacing
```

### Usage with NativeWind

```tsx
<View className="px-6 py-4 mb-6">
  {/* 24px horizontal, 16px vertical padding, 24px bottom margin */}
</View>
```

---

## Feature Components

### GroupCard
Displays group summary with balance and members.

```tsx
import GroupCard from '@/components/GroupCard';

<GroupCard group={group} />
```

### TransactionItem
Shows transaction in a list with status and amount.

```tsx
import TransactionItem from '@/components/TransactionItem';

<TransactionItem transaction={transaction} />
```

### NotificationItem
Displays notification with icon, time, and actions.

```tsx
import NotificationItem from '@/components/NotificationItem';

<NotificationItem notification={notification} />
```

### VoteCard
Shows proposal/vote with progress and status.

```tsx
import VoteCard from '@/components/VoteCard';

<VoteCard proposal={proposal} />
```

---

## Usage Guidelines

### Best Practices

1. **Use semantic components:** Prefer `<H1>` over `<Text className="text-3xl">`
2. **Consistent spacing:** Use the spacing scale for margins and padding
3. **Theme-aware:** All components adapt to light/dark mode automatically
4. **Accessibility:** Include labels and proper contrast ratios
5. **Error handling:** Always show error states for user inputs

### Code Examples

#### Form with Validation

```tsx
<ScrollView className="flex-1 bg-gray-50">
  <Container>
    <H2>Create Group</H2>
    <BodySmall>Fill in the details below</BodySmall>
    
    <Stack spacing="md">
      <Input
        label="Group Name"
        value={name}
        onChangeText={setName}
        error={errors.name}
        placeholder="Enter group name"
      />
      
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />
      
      <Button onPress={handleSubmit} disabled={loading}>
        {loading ? 'Creating...' : 'Create Group'}
      </Button>
    </Stack>
  </Container>
</ScrollView>
```

#### List Screen

```tsx
<Screen>
  <Container>
    <H2>My Groups</H2>
    
    <Stack spacing="sm">
      {groups.map(group => (
        <GroupCard key={group._id} group={group} />
      ))}
    </Stack>
    
    {groups.length === 0 && (
      <Center className="py-12">
        <BodyLarge>No groups yet</BodyLarge>
        <BodySmall>Create your first group to get started</BodySmall>
      </Center>
    )}
  </Container>
</Screen>
```

#### Card Layout

```tsx
<Card>
  <Row justify="between" align="center">
    <Column>
      <Label>Group Name</Label>
      <Body>{group.name}</Body>
    </Column>
    <Column align="end">
      <Caption>Balance</Caption>
      <H3>{formatCurrency(group.balance)}</H3>
    </Column>
  </Row>
  
  <Divider />
  
  <Row justify="between">
    <BodySmall>{group.members.length} members</BodySmall>
    <BodySmall>{group.type}</BodySmall>
  </Row>
</Card>
```

---

## Theme Management

### Using Theme Store

```tsx
import { useThemeStore } from '@/store/themeStore';

function MyComponent() {
  const { mode, colors, toggleTheme } = useThemeStore();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>
        Current theme: {mode}
      </Text>
      <Button onPress={toggleTheme}>
        Toggle Theme
      </Button>
    </View>
  );
}
```

### Theme Persistence

Theme preference is automatically persisted to AsyncStorage and restored on app restart.

---

## File Structure

```
mobile/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Loading.tsx
│   │   ├── Typography.tsx
│   │   ├── Layout.tsx
│   │   └── index.ts
│   ├── GroupCard.tsx
│   ├── TransactionItem.tsx
│   ├── NotificationItem.tsx
│   └── VoteCard.tsx
├── constants/
│   └── Theme.ts
└── store/
    └── themeStore.ts
```

---

## Future Enhancements

- [ ] Add animation variants for components
- [ ] Create more specialized form components
- [ ] Add toast/snackbar component
- [ ] Create modal/dialog components
- [ ] Add skeleton loading states
- [ ] Implement gesture-based interactions
- [ ] Add accessibility labels and roles

---

## Support

For questions or suggestions about the design system, please refer to the main project documentation or contact the development team.

**Maintained by:** Badenya Development Team  
**Last Review:** 2025-10-10
