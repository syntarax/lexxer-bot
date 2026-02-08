import sodium from 'sodium-native';
console.log('Sodium Native version:', sodium.SODIUM_LIBRARY_VERSION_MAJOR, sodium.SODIUM_LIBRARY_VERSION_MINOR);
console.log('crypto_aead_xchacha20poly1305_ietf_encrypt available:', typeof sodium.crypto_aead_xchacha20poly1305_ietf_encrypt);
