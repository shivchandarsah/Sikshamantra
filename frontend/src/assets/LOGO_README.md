# Siksha Mantra Logo Assets

This directory contains the official logo assets for Siksha Mantra educational platform.

## Logo Files

### 1. `siksha-mantra-logo.svg`
- **Usage**: Main logo with text for headers, landing pages, and branding
- **Dimensions**: 200x60px (scalable SVG)
- **Contains**: Logo icon + "Siksha Mantra" text in one line + tagline
- **Best for**: Hero sections, marketing materials, large displays

### 2. `siksha-mantra-horizontal.svg`
- **Usage**: Compact horizontal logo for navigation bars and headers
- **Dimensions**: 180x40px (scalable SVG)
- **Contains**: Logo icon + "Siksha Mantra" text in one line (compact)
- **Best for**: Navigation bars, headers, toolbars

### 3. `siksha-mantra-icon.svg`
- **Usage**: Icon-only version for favicons, app icons, and compact spaces
- **Dimensions**: 64x64px (scalable SVG)
- **Contains**: Logo icon only (book with graduation cap)
- **Best for**: Favicons, mobile app icons, social media profiles

## Logo Components

### Visual Elements
- **Book Symbol**: Represents knowledge and learning
- **Graduation Cap**: Symbolizes education and achievement
- **Network Dots**: Represents connection between students and teachers
- **Color Gradients**: 
  - Primary: Teal (#0D9488 to #10B981)
  - Secondary: Blue (#3B82F6 to #1D4ED8)
  - Accent: Orange (#F59E0B to #D97706)

### Typography
- **Font**: Arial, sans-serif
- **"Siksha Mantra"**: Displayed in one line with gradient colors
- **"Siksha"**: Primary gradient color (teal)
- **"Mantra"**: Secondary gradient color (blue)
- **Tagline**: "Learn • Grow • Excel"

## Usage Guidelines

### Do's
✅ Use the logo on clean, uncluttered backgrounds
✅ Maintain proper spacing around the logo
✅ Use the appropriate size for the context
✅ Preserve the original colors and proportions
✅ Use horizontal version for navigation bars

### Don'ts
❌ Don't modify the colors or gradients
❌ Don't stretch or distort the logo
❌ Don't use on busy or conflicting backgrounds
❌ Don't separate the icon from the text in the main logo

## Implementation

The logos are implemented through the `Logo.jsx` component with the following props:

```jsx
<Logo 
  size="md"           // sm, md, lg, xl
  showText={true}     // Show full logo with text
  iconOnly={false}    // Show only the icon
  horizontal={true}   // Use horizontal compact version
  className=""        // Additional CSS classes
/>
```

## Logo Variants

### Navigation Bar Usage
```jsx
<Logo size="md" horizontal={true} />
```

### Hero Section Usage
```jsx
<Logo size="xl" horizontal={true} />
```

### Icon Only Usage
```jsx
<Logo iconOnly={true} size="sm" />
```

## Brand Colors

```css
/* Primary Gradient */
background: linear-gradient(135deg, #0D9488 0%, #10B981 100%);

/* Secondary Gradient */
background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);

/* Accent Gradient */
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
```

---

**Created for**: Siksha Mantra Educational Platform  
**Date**: December 2025  
**Version**: 1.1 (One-line text update)