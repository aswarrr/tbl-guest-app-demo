type Subscriber = () => void;

let loadingRequestsCount = 0;
const subscribers = new Set<Subscriber>();

function emitChange() {
  subscribers.forEach((subscriber) => subscriber());
}

export const loadingService = {
  setLoading(loading: boolean) {
    if (loading) {
      loadingRequestsCount += 1;
    } else {
      loadingRequestsCount -= 1;

      if (loadingRequestsCount < 0) {
        loadingRequestsCount = 0;
      }
    }

    emitChange();
  },

  isLoading() {
    return loadingRequestsCount > 0;
  },

  subscribe(subscriber: Subscriber) {
    subscribers.add(subscriber);

    return () => {
      subscribers.delete(subscriber);
    };
  },
};
