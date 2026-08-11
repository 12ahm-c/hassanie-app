import { useUiStore } from "../uiStore";

beforeEach(() => {
  useUiStore.setState({ toasts: [] });
});

describe("UiStore", () => {
  it("should add a toast", () => {
    useUiStore.getState().addToast({ type: "success", message: "Test" });
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Test");
    expect(toasts[0].type).toBe("success");
  });

  it("should remove a toast", () => {
    useUiStore.getState().addToast({ type: "info", message: "Test" });
    const id = useUiStore.getState().toasts[0].id;
    useUiStore.getState().removeToast(id);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it("should auto-dismiss after duration", () => {
    jest.useFakeTimers();
    useUiStore.getState().addToast({ type: "success", message: "Test", duration: 1000 });
    expect(useUiStore.getState().toasts).toHaveLength(1);
    jest.advanceTimersByTime(1000);
    expect(useUiStore.getState().toasts).toHaveLength(0);
    jest.useRealTimers();
  });
});
