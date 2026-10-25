import { useEffect, useState } from 'react';

import api from '../api/client';
import { getErrorMessage } from '../api/errors';

export default function useApi(path, params = {}) {
    const paramsKey = JSON.stringify(params);
    const requestKey = `${path}?${paramsKey}`;

    const [result, setResult] = useState({ key: null, data: null, error: '' });

    useEffect(() => {
        let active = true;

        api.get(path, { params: JSON.parse(paramsKey) })
            .then((response) => {
                if (active) {
                    setResult({ key: requestKey, data: response.data, error: '' });
                }
            })
            .catch((requestError) => {
                if (active) {
                    setResult({ key: requestKey, data: null, error: getErrorMessage(requestError) });
                }
            });

        return () => {
            active = false;
        };
    }, [path, paramsKey, requestKey]);

    const loading = result.key !== requestKey;

    return {
        data: loading ? null : result.data,
        loading,
        error: loading ? '' : result.error,
    };
}
