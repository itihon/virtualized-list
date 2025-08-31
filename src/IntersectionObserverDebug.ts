export default class IntersectionObserverDebug extends IntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    const observedArea = document.createElement('div');
    observedArea.style.position = 'absolute';
    observedArea.style.backgroundColor = 'rgba(165, 145, 145, .5)';
    observedArea.style.outline = '4px solid orange';
    observedArea.style.zIndex = '-1';
    document.body.appendChild(observedArea);

    const wrapper = (entries: Array<IntersectionObserverEntry>, observer: IntersectionObserver) => {
      const { rootBounds } = entries[0];
      const { scrollTop, scrollLeft } = document.documentElement;

      if (rootBounds) {
        const { left, top, width, height } = rootBounds;

        observedArea.style.left = `${left + scrollLeft}px`;
        observedArea.style.top = `${top + scrollTop}px`;
        observedArea.style.width = `${width}px`;
        observedArea.style.height = `${height}px`;
      }

      callback.call(this, entries, observer);
    };

    super(wrapper, options);
    console.warn('You are using IntersectionObserverDebug. Do not forget to remove it and use normal IntersectionObserver.');
  }
}