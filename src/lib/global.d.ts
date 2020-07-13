declare namespace jest {
    interface Matchers<R> {
        toBeFloat(a: number, tolerance?: number): R;
    }
}