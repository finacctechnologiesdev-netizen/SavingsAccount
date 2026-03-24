export function AutoUnsubscribe(constructor: any) {
    const original = constructor.prototype.ngOnDestroy;

    constructor.prototype.ngOnDestroy = function () {
        for (const prop in this) {
            const property = this[prop];
            if (property && typeof property.unsubscribe === 'function') {
                property.unsubscribe();
            }
        }
        if (original && typeof original === 'function') {
            original.apply(this, arguments);
        }
    };
}
