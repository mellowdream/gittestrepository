
export const isset = (variable) => {
    try {
        return typeof eval(variable) !== 'undefined';
    } catch (err) {
        return false;
    }
};
