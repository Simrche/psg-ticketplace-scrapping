export async function wait(duration: number, randomized = false) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}
