export {}

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeFloat(a: number): R;
        }
    }
}
