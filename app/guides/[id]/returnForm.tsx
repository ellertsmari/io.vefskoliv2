import Modal from "components/modal/modal";
import Button from "globalStyles/buttons/default";
import Input from "globalStyles/input";

import { Form } from "./style";

const ReturnForm = () => {
  return <Modal modalTrigger={ReturnButton} modalContent={FormContent} />;
};

const ReturnButton = <Button style="default">RETURN</Button>;

const FormContent = (
  <Form>
    <Input type="text" label="Github or Figma URL" id={"link-to-work"}></Input>
    <Input
      type="text"
      label="Live version or prototype(Figma)"
      id={"link-to-live"}
    ></Input>
    <Input
      type="text"
      label="Image that suits your project (optional)"
      id={"image-of-project"}
    ></Input>
    <Input type="text" label="Project title" id={"title"}></Input>
    <Input
      type="textarea"
      label="Short project description"
      id={"description"}
    ></Input>
    <Button style="default">SUBMIT</Button>
  </Form>
);

export default ReturnForm;
