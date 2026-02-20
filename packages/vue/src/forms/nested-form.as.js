// prettier-ignore-start
/* eslint-disable */
/* oxlint-disable */
import { defineAnnotatedType as $, annotate as $a } from "@atscript/typescript/utils"

export class NestedForm {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error("JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces.")
  }
}

$("object", NestedForm)
  .prop(
    "companyName",
    $().designType("string")
      .tags("string")
      .annotate("meta.label", "Company Name")
      .annotate("meta.placeholder", "Acme Corp")
      .annotate("foorm.type", "text")
      .annotate("meta.required", { message: "Company name is required" })
      .annotate("foorm.order", 1)
      .$type
  ).prop(
    "address",
    $("object")
      .prop(
        "street",
        $().designType("string")
          .tags("string")
          .annotate("meta.label", "Street")
          .annotate("meta.placeholder", "123 Main St")
          .annotate("foorm.type", "text")
          .annotate("meta.required", { message: "Street is required" })
          .annotate("foorm.order", 3)
          .$type
      ).prop(
        "city",
        $().designType("string")
          .tags("string")
          .annotate("meta.label", "City")
          .annotate("meta.placeholder", "New York")
          .annotate("foorm.type", "text")
          .annotate("meta.required", { message: "City is required" })
          .annotate("foorm.order", 4)
          .$type
      ).prop(
        "zip",
        $().designType("string")
          .tags("string")
          .annotate("meta.label", "ZIP Code")
          .annotate("meta.placeholder", "10001")
          .annotate("foorm.type", "text")
          .annotate("meta.required", { message: "ZIP code is required" })
          .annotate("foorm.order", 5)
          .$type
      ).prop(
        "country",
        $("object")
          .prop(
            "name",
            $().designType("string")
              .tags("string")
              .annotate("meta.label", "Country Name")
              .annotate("meta.placeholder", "United States")
              .annotate("foorm.type", "text")
              .annotate("meta.required", { message: "Country name is required" })
              .annotate("foorm.order", 7)
              .$type
          ).prop(
            "code",
            $().designType("string")
              .tags("string")
              .annotate("meta.label", "Country Code")
              .annotate("meta.placeholder", "US")
              .annotate("foorm.type", "text")
              .annotate("foorm.fn.hint", "(v) => v && v.length !== 2 ? \"Use a 2-letter ISO code\" : \"\"")
              .annotate("meta.required", { message: "Country code is required" })
              .annotate("foorm.order", 8)
              .$type
          )
          .annotate("foorm.order", 6)
          .$type
      )
      .annotate("foorm.title", "Headquarters")
      .annotate("foorm.order", 2)
      .$type
  ).prop(
    "contact",
    $("object")
      .prop(
        "firstName",
        $().designType("string")
          .tags("string")
          .annotate("meta.label", "Contact First Name")
          .annotate("meta.placeholder", "Jane")
          .annotate("foorm.type", "text")
          .annotate("meta.required", { message: "First name is required" })
          .annotate("foorm.order", 11)
          .$type
      ).prop(
        "lastName",
        $().designType("string")
          .tags("string")
          .annotate("meta.label", "Contact Last Name")
          .annotate("meta.placeholder", "Doe")
          .annotate("foorm.type", "text")
          .annotate("foorm.order", 12)
          .optional()
          .$type
      ).prop(
        "email",
        $().designType("string")
          .tags("email", "string")
          .annotate("meta.label", "Contact Email")
          .annotate("meta.placeholder", "jane@acme.com")
          .annotate("foorm.type", "text")
          .annotate("foorm.autocomplete", "email")
          .annotate("foorm.fn.description", "(v, data) => data.contact?.firstName ? \"Email for \" + data.contact.firstName : \"Contact email address\"")
          .annotate("foorm.order", 13)
          .annotate("expect.pattern", { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",  flags: "",  message: "Invalid email format." }, true)
          .optional()
          .$type
      ).prop(
        "department",
        $("object")
          .prop(
            "name",
            $().designType("string")
              .tags("string")
              .annotate("meta.label", "Department Name")
              .annotate("meta.placeholder", "Engineering")
              .annotate("foorm.type", "text")
              .annotate("foorm.order", 15)
              .optional()
              .$type
          ).prop(
            "floor",
            $().designType("number")
              .tags("number")
              .annotate("meta.label", "Floor")
              .annotate("foorm.type", "number")
              .annotate("foorm.order", 16)
              .annotate("expect.min", { minValue: 1,  message: "Floor must be at least 1" })
              .annotate("expect.max", { maxValue: 100,  message: "Floor must be at most 100" })
              .optional()
              .$type
          ).prop(
            "room",
            $().designType("string")
              .tags("string")
              .annotate("meta.label", "Room")
              .annotate("meta.placeholder", "A-101")
              .annotate("foorm.type", "text")
              .annotate("foorm.fn.hidden", "(v, data) => !data.contact?.department?.floor")
              .annotate("foorm.order", 17)
              .optional()
              .$type
          )
          .annotate("foorm.order", 14)
          .$type
      )
      .annotate("foorm.order", 10)
      .$type
  )
  .annotate("foorm.title", "Company Profile")
  .annotate("foorm.submit.text", "Save Profile")

// prettier-ignore-end