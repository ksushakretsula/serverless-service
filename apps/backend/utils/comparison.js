export const hasValueChanged = (newValue, oldValue) => {
    if (newValue === undefined || newValue === null) {
        return false;
    }

    if (typeof newValue === 'number' && typeof oldValue === 'number') {
        return Math.abs(newValue - oldValue) > 1e-6;
    }

    if (typeof newValue === 'string' && typeof oldValue === 'string') {
        return newValue.trim() !== oldValue.trim();
    }

    if (typeof newValue === 'boolean' && typeof oldValue === 'boolean') {
        return newValue !== oldValue;
    }

    return newValue !== oldValue;
};

export const getChangedFields = (newData, existingData) => {
    const changedFields = {};

    for (const [key, newValue] of Object.entries(newData)) {
        if (hasValueChanged(newValue, existingData[key])) {
            changedFields[key] = newValue;
        }
    }

    return changedFields;
};
