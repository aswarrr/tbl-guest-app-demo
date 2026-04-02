import ToastMessage from "./ToastMessage";

type Props = {
  message?: string;
};

export default function WarningMessage({ message }: Props) {
  return <ToastMessage message={message} type="warning" />;
}
