# 🔍 Vision Analysis Strategy - English

## ✅ Objective

You want to:

- Analyze the image with Vision and extract:
  - Exact colors
  - Style
  - Graphic elements and patterns
  - Layout and position of name and number
  - Type of collar, sleeves, etc.

- Build an output prompt with these details, where you only change name and number to generate new versions with DALL·E 3.

## ✅ Prompt to send to Vision

You should send this text (in Portuguese or English) along with the image. I recommend in English, as the model tends to understand better.

### 🔍 Analysis Prompt for Vision (in English)

```
You are a jersey design expert. Analyze the image of this football jersey and extract all key design details in a technical and structured way. I will use this information to generate a new jersey with modified name and number, so I need high accuracy and visual detail.

Please describe:

1. Exact main and secondary colors (e.g., white, gradient black, etc.)
2. Style of the jersey (modern, retro, minimal, etc.)
3. Graphic patterns (describe if any are visible, like textures inside the numbers)
4. Placement and typography of name and number
5. Collar type (round, V-neck, polo, etc.)
6. Sleeve and shoulder style (plain, gradient, or patterned)
7. Any additional visual elements

Respond in structured text, like a product specification, and be precise with the visual language.
```

## ✅ Expected Output Example (to build the new prompt for DALL·E 3)

Here's how the ideal output text should look, which you'll use as a base to generate new images in DALL·E 3:

### 🎨 Final Prompt (generated based on analysis)

```
Football jersey design for a player.

Main color: bright white (upper half), fading into dark grey/black gradient toward the bottom.
Sleeves: black with subtle grey gradient from shoulder to edge.
Collar: round and minimal, same color as upper torso (white).
Back number: large, centered, black with circular tribal pattern inside, outlined in white.
Player name: uppercase sans-serif font, black color, centered above the number.
Style: modern and clean with contrast gradient design, no sponsor logos or mannequin.
Additional: smooth texture, no stitching details shown. The jersey has a sleek and athletic look.

Replace name with: {{NAME}}  
Replace number with: {{NUMBER}}
```

## ✅ How to use in your app flow:

### 1. Send image + analysis prompt to Vision
Receive the structured text.

### 2. Insert dynamic variables:
```typescript
const promptFinal = visionResult
  .replace("{{NAME}}", userName)
  .replace("{{NUMBER}}", userNumber);
```

### 3. Send this as prompt to DALL·E 3 in your final generation.

## ✅ Expected Result

If you do this correctly, DALL·E 3:
- Will maintain the same style and pattern of the jersey
- And only change the name and number with high fidelity

## 🔧 Implementation in Vision-Test Page

### Analysis Phase:
```typescript
const analysisPrompt = `You are a jersey design expert. Analyze the image of this football jersey and extract all key design details...`;

const analysisResponse = await fetch('/api/vision-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_base64: imageBase64,
    prompt: analysisPrompt,
    model: 'openai/gpt-4o-mini'
  })
});
```

### Generation Phase:
```typescript
const finalPrompt = analysisResult
  .replace("{{NAME}}", playerName)
  .replace("{{NUMBER}}", playerNumber);

const generationResponse = await fetch('/api/vision-generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: finalPrompt,
    quality: 'standard'
  })
});
```

## 🎯 Key Success Factors

1. **Structured Analysis**: Guide the Vision model with clear, numbered topics
2. **Technical Language**: Use precise visual terminology
3. **Template Variables**: Include placeholders for dynamic replacement
4. **Clean Output**: Request structured, specification-like responses
5. **High Fidelity**: Focus on exact color and pattern reproduction 