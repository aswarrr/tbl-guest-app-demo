import ToastMessage from "./ToastMessage";

type Props = {
  message?: string;
};

export default function SuccessMessage({ message }: Props) {
  return <ToastMessage message={message} type="success" />;
}
