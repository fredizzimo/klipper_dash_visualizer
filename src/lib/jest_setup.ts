export {}

// Negative zero should be the same as positive zero and jest doesn't do that by default
expect.extend({
    toBeFloat(received: number, expected: number) {
        if (received === expected) {
            return {
                message: () => `expected ${received} not to be ${expected}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be ${expected}`,
                pass: false,
            };
        }         
    },
});
