// Improved fraction handling system
class FractionConverter {
    constructor() {
        this.fractionMap = {
            '½': 0.5, '¼': 0.25, '¾': 0.75,
            '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
            '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9,
            '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9
        };
        
        this.fractionPatterns = [
            // Patterns for fractions like "1 1/2", "1-1/2", "1½"
            /^(\d+)[\s\-]*(\d+)\/(\d+)$/,  // "1 1/2" or "1-1/2"
            /^(\d+)[\s\-]*([½¼¾⅛⅜⅝⅞])$/,  // "1 ½" or "1-½"
            /^(\d+)([½¼¾⅛⅜⅝⅞])$/,         // "1½" (no space)
            /^(\d+)\/(\d+)$/,              // "1/2"
            /^([½¼¾⅛⅜⅝⅞])$/,              // "½" (just fraction)
            /^(\d+)$/,                     // "1" (whole number)
            /^(\d+\.\d+)$/                 // "1.5" (decimal)
        ];
    }

    // Convert any fraction string to decimal
    parseFraction(input) {
        if (typeof input === 'number') return input;
        
        let str = input.toString().trim().replace(',', '.');
        
        // Try each pattern
        for (let pattern of this.fractionPatterns) {
            const match = str.match(pattern);
            if (match) {
                return this.handleMatch(match);
            }
        }
        
        // If no pattern matches, try direct conversion
        const directConvert = this.tryDirectConversion(str);
        if (directConvert !== null) return directConvert;
        
        throw new Error(`Cannot parse fraction: ${input}`);
    }

    handleMatch(match) {
        // Pattern 1: "1 1/2" or "1-1/2"
        if (match[1] && match[2] && match[3]) {
            return parseInt(match[1]) + (parseInt(match[2]) / parseInt(match[3]));
        }
        
        // Pattern 2: "1 ½" or "1-½"
        if (match[1] && this.fractionMap[match[2]]) {
            return parseInt(match[1]) + this.fractionMap[match[2]];
        }
        
        // Pattern 3: "1½" (no space)
        if (match[1] && this.fractionMap[match[2]]) {
            return parseInt(match[1]) + this.fractionMap[match[2]];
        }
        
        // Pattern 4: "1/2"
        if (match[1] && match[2]) {
            return parseInt(match[1]) / parseInt(match[2]);
        }
        
        // Pattern 5: "½" (just fraction)
        if (this.fractionMap[match[1]]) {
            return this.fractionMap[match[1]];
        }
        
        // Pattern 6: "1" (whole number)
        if (match[1]) {
            return parseFloat(match[1]);
        }
        
        // Pattern 7: "1.5" (decimal)
        if (match[1]) {
            return parseFloat(match[1]);
        }
        
        return null;
    }

    tryDirectConversion(str) {
        // Try to parse as decimal
        const decimal = parseFloat(str);
        if (!isNaN(decimal)) return decimal;
        
        // Try to find fraction characters
        for (let [char, value] of Object.entries(this.fractionMap)) {
            if (str.includes(char)) {
                return this.parseComplexFraction(str);
            }
        }
        
        return null;
    }

    parseComplexFraction(str) {
        // Handle complex cases like "1 ½" with mixed formatting
        let total = 0;
        let currentNumber = '';
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            
            if (char >= '0' && char <= '9') {
                currentNumber += char;
            } else if (char === '.' || char === ',') {
                currentNumber += '.';
            } else if (this.fractionMap[char]) {
                if (currentNumber) {
                    total += parseFloat(currentNumber);
                    currentNumber = '';
                }
                total += this.fractionMap[char];
            } else if (char === ' ' || char === '-') {
                if (currentNumber) {
                    total += parseFloat(currentNumber);
                    currentNumber = '';
                }
            }
        }
        
        // Add any remaining number
        if (currentNumber) {
            total += parseFloat(currentNumber);
        }
        
        return total;
    }

    // Convert decimal to construction fraction string
    toConstructionFraction(decimal, denominator = 16) {
        if (decimal === 0) return "0";
        
        const whole = Math.floor(decimal);
        const fraction = decimal - whole;
        
        if (Math.abs(fraction) < 0.0001) return whole.toString();
        
        const numerator = Math.round(fraction * denominator);
        const gcd = this.GCD(numerator, denominator);
        const simpleNum = numerator / gcd;
        const simpleDen = denominator / gcd;
        
        // Common fractions to symbols
        const commonFractions = {
            '1/2': '½', '1/4': '¼', '3/4': '¾',
            '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
        };
        
        const fractionStr = `${simpleNum}/${simpleDen}`;
        const fractionSymbol = commonFractions[fractionStr];
        
        if (fractionSymbol) {
            return whole === 0 ? fractionSymbol : `${whole} ${fractionSymbol}`;
        }
        
        if (simpleDen === 1) {
            return (whole + simpleNum).toString();
        }
        
        if (whole === 0) {
            return fractionStr;
        }
        
        return `${whole} ${simpleNum}/${simpleDen}`;
    }

    GCD(a, b) {
        return b === 0 ? a : this.GCD(b, a % b);
    }
}

// Initialize fraction converter
const fractionConverter = new FractionConverter();

// Main calculation function with exact and approximate matches
function calculateBaluster(W_total, T) {
    try {
        const u = 16; // Fixed fraction unit
        let T_num = fractionConverter.parseFraction(T);
        const TARGET_S = 3.0; // Target spacing = 3 inches
        const MAX_DIFF = 0.25; // Maximum difference = 1/4 inch
        
        let bestExact = null;
        let bestApprox = null;

        // Search for exact matches (A = S)
        for (let N = 1; N <= 300; N++) {
            const S_units = (W_total * u - N * T_num * u) / (N + 1);
            
            if (S_units > 0 && Math.abs(S_units - Math.round(S_units)) < 0.0001) {
                const S_inch = S_units / u;
                
                // ✅ ФИЛЬТР: S >= 3 и S < 4 (без включения 4)
                if (S_inch >= 3 && S_inch < 4) {
                    const C1 = S_inch + T_num / 2;
                    const Step = S_inch + T_num;
                    const diffFromTarget = Math.abs(S_inch - TARGET_S);
                    
                    if (!bestExact || diffFromTarget < bestExact.diffFromTarget) {
                        bestExact = {
                            N: N,
                            S: S_inch,
                            C1: C1,
                            Step: Step,
                            diffFromTarget: diffFromTarget,
                            type: "Exact"
                        };
                    }
                }
            }
        }

        // If exact match found, return it
        if (bestExact) {
            return {
                success: true,
                N: bestExact.N,
                C1: fractionConverter.toConstructionFraction(bestExact.C1),
                Step: fractionConverter.toConstructionFraction(bestExact.Step),
                type: bestExact.type,
                spacing: bestExact.S
            };
        }

        // Search for approximate matches (A ≈ S) with max_diff = 1/4
        for (let N = 1; N <= 300; N++) {
            const S_exact = (W_total - N * T_num) / (N + 1);
            const S_rounded = Math.round(S_exact * u) / u;
            const A_calculated = (W_total - N * T_num - (N - 1) * S_rounded) / 2;
            const A_rounded = Math.round(A_calculated * u) / u;
            
            const diff = Math.abs(A_rounded - S_rounded);
            
            // ✅ ФИЛЬТР: S >= 3 и S < 4, и diff <= 1/4
            if (A_rounded > 0 && S_rounded > 0 && diff <= MAX_DIFF && 
                S_rounded >= 3 && S_rounded < 4) {
                
                const C1 = A_rounded + T_num / 2;
                const Step = S_rounded + T_num;
                const diffFromTarget = Math.abs(S_rounded - TARGET_S);
                
                if (!bestApprox || diffFromTarget < bestApprox.diffFromTarget) {
                    bestApprox = {
                        N: N,
                        S: S_rounded,
                        C1: C1,
                        Step: Step,
                        diff: diff,
                        diffFromTarget: diffFromTarget,
                        type: "Approx"
                    };
                }
            }
        }

        // If approximate match found, return it
        if (bestApprox) {
            return {
                success: true,
                N: bestApprox.N,
                C1: fractionConverter.toConstructionFraction(bestApprox.C1),
                Step: fractionConverter.toConstructionFraction(bestApprox.Step),
                type: bestApprox.type + " (Diff: " + fractionConverter.toConstructionFraction(bestApprox.diff) + ")",
                spacing: bestApprox.S
            };
        }

        return { 
            success: false, 
            message: "No suitable configuration found with spacing between 3-4 inches. Try adjusting parameters." 
        };
        
    } catch (error) {
        return { 
            success: false, 
            message: "Calculation error: " + error.message 
        };
    }
}

// UI calculation function
function calculate() {
    const wTotalInput = document.getElementById('wTotal');
    const thicknessInput = document.getElementById('thickness');
    const resultSection = document.getElementById('resultSection');
    const errorMessage = document.getElementById('errorMessage');
    
    // Reset displays
    resultSection.classList.remove('active');
    errorMessage.style.display = 'none';
    
    // Validate inputs
    const wTotal = fractionConverter.parseFraction(wTotalInput.value);
    if (isNaN(wTotal) || wTotal <= 0) {
        showError("Please enter a valid positive number for total distance.");
        return;
    }
    
    if (wTotal < 10) {
        showError("Total distance should be at least 10 inches.");
        return;
    }
    
    const thickness = thicknessInput.value;
    if (!thickness) {
        showError("Please enter baluster thickness.");
        return;
    }
    
    let thicknessNum;
    try {
        thicknessNum = fractionConverter.parseFraction(thickness);
    } catch (e) {
        showError("Please enter a valid baluster thickness (e.g., 1.5, 1½, 1 1/2, 2¼).");
        return;
    }
    
    if (isNaN(thicknessNum) || thicknessNum <= 0) {
        showError("Please enter a valid baluster thickness (e.g., 1.5, 1½, 1 1/2, 2¼).");
        return;
    }
    
    // Perform calculation
    const result = calculateBaluster(wTotal, thickness);
    
    if (result.success) {
        document.getElementById('resultN').textContent = result.N;
        document.getElementById('resultC1').textContent = result.C1;
        document.getElementById('resultStep').textContent = result.Step;
        document.getElementById('resultType').textContent = result.type;
        resultSection.classList.add('active');
    } else {
        showError(result.message);
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Add input examples and help
function showInputExamples() {
    const examples = [
        "1.5", "1½", "1 1/2", "2¼", "3¾", "1-1/2", "2.125"
    ];
    
    console.log("Supported input formats:", examples);
}