import { IMobilePlayerControlsProps, IMobileDeviceNode } from './MobilePlayerControls.types';

export class MobilePlayerControlsController {
  private props: IMobilePlayerControlsProps;
  private contextDevices: IMobileDeviceNode[];
  private activeTabId: string | undefined;
  private myTabId: string | undefined;

  constructor(props: IMobilePlayerControlsProps, playerContext: any) {
    this.props = props;
    this.contextDevices = playerContext?.connectedDevices || [];
    this.activeTabId = playerContext?.activeTabId;
    this.myTabId = playerContext?.myTabId;
  }

  public get effectiveDevices(): IMobileDeviceNode[] {
    return this.props.connectedDevices || this.contextDevices || [];
  }

  public get activeDevice(): IMobileDeviceNode | undefined {
    return this.effectiveDevices.find(d => d.tabInstanceId === this.activeTabId) || this.effectiveDevices[0];
  }

  public get activeDeviceLabel(): string {
    return this.activeDevice?.label || 'AirPods Max';
  }

  public get myDevice(): IMobileDeviceNode | undefined {
    return this.effectiveDevices.find(d => d.tabInstanceId === this.myTabId);
  }

  public getProgressPercent(displayTime: number): number {
    const dur = this.props.duration;
    if (!dur || dur <= 0) return 0;
    return Math.min(100, Math.max(0, (displayTime / dur) * 100));
  }

  public getRemainingTime(displayTime: number): number {
    const dur = this.props.duration;
    if (!dur) return 0;
    return displayTime - dur;
  }

  public toggleRoutePopup(): void {
    const isOpen = this.props.isDevicesOpen;
    this.props.setIsDevicesOpen?.(!isOpen);
    if (!isOpen) {
      this.props.setIsQueueOpen?.(false);
    }
  }

  public toggleQueueSheet(currentQueueState: boolean): void {
    this.props.setIsQueueOpen?.(!currentQueueState);
    if (!currentQueueState) {
      this.props.setIsLyricsOpen(false);
      this.props.setIsDevicesOpen?.(false);
    }
  }

  public toggleLyricsView(): void {
    if (this.props.linesLength > 0) {
      const nextState = !this.props.isLyricsOpen;
      this.props.setIsLyricsOpen(nextState);
      if (nextState) {
        this.props.setIsQueueOpen?.(false);
        this.props.setIsDevicesOpen?.(false);
      }
    }
  }
}
