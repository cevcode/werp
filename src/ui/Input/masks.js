import { emailMask } from 'text-mask-addons/dist/emailMask';

const MASK_TYPES = {
    email: emailMask,
};

function getMask(mask) {
    if (MASK_TYPES.hasOwnProperty(mask)) {
        return MASK_TYPES[mask];
    }
    return null;
}

export { getMask };
