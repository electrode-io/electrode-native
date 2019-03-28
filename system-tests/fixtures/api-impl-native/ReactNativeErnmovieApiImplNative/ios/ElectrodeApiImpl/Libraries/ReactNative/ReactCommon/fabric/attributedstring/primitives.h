/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace react {

enum class FontStyle {
  Normal,
  Italic,
  Oblique
};

enum class FontWeight: int {
  Weight100 = 100,
  UltraLight = 100,
  Weight200 = 200,
  Thin = 200,
  Weight300 = 300,
  Light = 300,
  Weight400 = 400,
  Regular = 400,
  Weight500 = 500,
  Medium = 500,
  Weight600 = 600,
  Semibold = 600,
  Demibold = 600,
  Weight700 = 700,
  Bold = 700,
  Weight800 = 800,
  Heavy = 800,
  Weight900 = 900,
  Black = 900
};

enum class FontVariant: int {
  Default = 0,
  SmallCaps = 1 << 1,
  OldstyleNums = 1 << 2,
  LiningNums = 1 << 3,
  TabularNums = 1 << 4,
  ProportionalNums = 1 << 5
};

enum class EllipsizeMode {
  Clip,  // Do not add ellipsize, simply clip.
  Head,  // Truncate at head of line: "...wxyz".
  Tail,  // Truncate at tail of line: "abcd...".
  Middle // Truncate middle of line: "ab...yz".
};

enum class TextAlignment {
  Natural,  // Indicates the default alignment for script.
  Left,     // Visually left aligned.
  Center,   // Visually centered.
  Right,    // Visually right aligned.
  Justified // Fully-justified. The last line in a paragraph is natural-aligned.
};

enum class WritingDirection {
  Natural,     // Determines direction using the Unicode Bidi Algorithm rules P2 and P3.
  LeftToRight, // Left to right writing direction.
  RightToLeft  // Right to left writing direction.
};

enum class TextDecorationLineType {
  None,
  Underline,
  Strikethrough,
  UnderlineStrikethrough
};

enum class TextDecorationLineStyle {
  Single,
  Thick,
  Double
};

enum class TextDecorationLinePattern {
  Solid,
  Dot,
  Dash,
  DashDot,
  DashDotDot,
};

} // namespace react
} // namespace facebook

