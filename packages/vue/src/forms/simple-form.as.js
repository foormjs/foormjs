// prettier-ignore-start
/* eslint-disable */
/* oxlint-disable */
import { defineAnnotatedType as $, annotate as $a } from "@atscript/typescript/utils"

export class SimpleForm {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error("JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces.")
  }
}


class Address {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error("JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces.")
  }
}

$("object", SimpleForm)
  .prop(
    "title",
    $("array")
      .of($().designType("string")
          .tags("string")
          .$type)
      .$type
  ).prop(
    "content",
    $().designType("string")
      .tags("string")
      .$type
  ).prop(
    "complex",
    $("union")
      .item($("tuple")
          .item($().designType("string")
              .tags("string")
              .$type)
          .item($().designType("boolean")
              .tags("boolean")
              .$type)
          .item($().designType("string")
              .tags("string")
              .$type)
          .$type)
      .item($()
          .refTo(Address)
          .annotate("meta.label", "Address")
          .$type)
      .item($("array")
          .of($("array")
              .of($().designType("string")
                  .tags("string")
                  .$type)
              .$type)
          .$type)
      .annotate("meta.label", "Complex Field")
      .$type
  ).prop(
    "test",
    $("array")
      .of($().designType("string")
          .tags("string")
          .$type)
      .annotate("meta.label", "Agree to terms")
      .optional()
      .$type
  )
  .annotate("meta.label", "Quick Note")
  .annotate("meta.required", { })
  .annotate("foorm.submit.text", "Save")

$("object", Address)
  .prop(
    "street",
    $().designType("string")
      .tags("string")
      .$type
  ).prop(
    "city",
    $().designType("string")
      .tags("string")
      .$type
  ).prop(
    "country",
    $().designType("string")
      .tags("string")
      .$type
  )
  .annotate("meta.label", "Address")

// prettier-ignore-end