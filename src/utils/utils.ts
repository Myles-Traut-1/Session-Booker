const normalizeDateToMidnightUTC = (val: Date | string) => {
    const d = new Date(val);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

export { normalizeDateToMidnightUTC };